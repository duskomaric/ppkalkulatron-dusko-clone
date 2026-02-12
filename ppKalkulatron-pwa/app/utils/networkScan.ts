import { OFS } from "~/config/constants";

export interface IPRange {
    base: string;
    start: number;
    end: number;
}

export interface FoundDevice {
    ip: string;
    port: number;
    url: string;
    name?: string;
}

export interface ScanProgress {
    current: number;
    total: number;
    currentIp: string;
}

/**
 * Dobija lokalne IP adrese korisnika koristeći WebRTC API.
 * Vraća niz IP adresa (npr. ["192.168.31.102", "10.0.0.5"]).
 */
export async function getLocalIPAddresses(): Promise<string[]> {
    return new Promise((resolve) => {
        const ips: string[] = [];
        const RTCPeerConnection =
            window.RTCPeerConnection ||
            (window as any).webkitRTCPeerConnection ||
            (window as any).mozRTCPeerConnection;

        if (!RTCPeerConnection) {
            console.warn("[Network Scan] WebRTC not supported, falling back to common ranges");
            resolve([]);
            return;
        }

        console.log("[Network Scan] Starting WebRTC IP detection...");

        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
            ],
        });

        pc.createDataChannel("");

        let candidateCount = 0;
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                candidateCount++;
                const candidate = event.candidate.candidate;
                console.log(`[Network Scan] ICE candidate ${candidateCount}:`, candidate);

                // Parsiraj IP adresu iz ICE candidate stringa
                const ipMatches = candidate.matchAll(/([0-9]{1,3}\.){3}[0-9]{1,3}/g);

                for (const match of ipMatches) {
                    const ip = match[0];
                    // Filtriraj samo lokalne IP adrese (ne javne)
                    // 192.168.x.x, 10.x.x.x, 172.16-31.x.x, 127.0.0.1
                    const isLocalIP =
                        ip.startsWith("192.168.") ||
                        ip.startsWith("10.") ||
                        (ip.startsWith("172.") && /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) ||
                        ip === "127.0.0.1";

                    if (isLocalIP && !ips.includes(ip)) {
                        ips.push(ip);
                        console.log(`[Network Scan] ✓ Found local IP: ${ip}`);
                    } else if (!isLocalIP) {
                        console.log(`[Network Scan] Skipped public IP: ${ip}`);
                    }
                }
            } else {
                // event.candidate === null znači da je ICE gathering završen
                console.log("[Network Scan] ICE gathering complete");
            }
        };

        pc.onicegatheringstatechange = () => {
            console.log(`[Network Scan] ICE gathering state: ${pc.iceGatheringState}`);
        };

        pc.createOffer({ offerToReceiveAudio: false, offerToReceiveVideo: false })
            .then((offer) => {
                console.log("[Network Scan] Offer created, setting local description...");
                return pc.setLocalDescription(offer);
            })
            .then(() => {
                console.log("[Network Scan] Local description set");
            })
            .catch((err) => {
                console.error("[Network Scan] Error creating offer:", err);
                resolve([]);
            });

        // Povećan timeout na 5 sekundi
        const timeout = setTimeout(() => {
            console.log(`[Network Scan] Timeout reached. Found ${ips.length} IP(s):`, ips);
            pc.close();
            resolve(ips);
        }, 5000);

        // Ako se ICE gathering završi pre timeout-a, proveri rezultate
        const checkInterval = setInterval(() => {
            if (pc.iceGatheringState === "complete") {
                clearInterval(checkInterval);
                clearTimeout(timeout);
                console.log(`[Network Scan] ICE gathering complete. Found ${ips.length} IP(s):`, ips);
                setTimeout(() => {
                    pc.close();
                    resolve(ips);
                }, 500); // Mala pauza da se svi kandidati obrade
            }
        }, 100);
    });
}

/**
 * Generiše opseg IP adresa na osnovu lokalne IP adrese.
 * Npr. ako je lokalna IP 192.168.31.102, generiše opseg 192.168.31.1-254.
 */
export function generateIPRangesFromLocalIPs(localIPs: string[]): IPRange[] {
    const ranges: IPRange[] = [];
    const seenBases = new Set<string>();

    for (const ip of localIPs) {
        const parts = ip.split(".");
        if (parts.length === 4) {
            const base = `${parts[0]}.${parts[1]}.${parts[2]}`;
            if (!seenBases.has(base)) {
                seenBases.add(base);
                ranges.push({
                    base,
                    start: 1,
                    end: 254,
                });
                console.log(`[Network Scan] Generated range from local IP ${ip}: ${base}.1-254`);
            }
        }
    }

    // Ako nismo našli nijednu lokalnu IP, koristimo česte opsege
    if (ranges.length === 0) {
        console.log("[Network Scan] No local IPs found, using common ranges");
        ranges.push(
            { base: "192.168.1", start: 1, end: 254 },
            { base: "192.168.0", start: 1, end: 254 },
            { base: "192.168.31", start: 1, end: 254 },
            { base: "10.0.0", start: 1, end: 254 }
        );
    }

    return ranges;
}

/**
 * Parsira ručno uneseni IP opseg.
 * Format: "192.168.31.100-105" ili "192.168.31.102"
 */
export function parseManualIPRange(range: string): IPRange | null {
    const rangeMatch = range.trim().match(/^(\d+\.\d+\.\d+)\.(\d+)(?:-(\d+))?$/);
    if (rangeMatch) {
        const [, base, startStr, endStr] = rangeMatch;
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : start;
        if (start >= 1 && start <= 254 && end >= start && end <= 254) {
            return { base, start, end };
        }
    }
    return null;
}

/**
 * Testira da li uređaj na datoj IP adresi i portu odgovara na /api/attention endpoint.
 * Vraća true ako attention vrati 200 OK.
 */
export async function testDevice(
    serviceWorker: ServiceWorker,
    ip: string,
    port: number,
    apiKey?: string
): Promise<{ found: boolean; status?: number }> {
    const url = `http://${ip}:${port}${OFS.PATHS.ATTENTION}`;
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
    };
    if (apiKey) {
        headers["Authorization"] = "Bearer " + apiKey;
    }

    return new Promise((resolve) => {
        const channel = new MessageChannel();
        let resolved = false;

        const timeout = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                channel.port1.onmessage = null;
                resolve({ found: false });
            }
        }, 3000);

        channel.port1.onmessage = (event: MessageEvent) => {
            if (resolved) return;
            clearTimeout(timeout);
            resolved = true;
            const payload = event.data ?? {};
            const { success, ok, status } = payload;

            console.log(`[Network Scan] ${ip}:${port} - success: ${success}, ok: ${ok}, status: ${status}`);

            // Ako attention vrati 200 OK, uređaj je pronađen
            if (success && ok && status === 200) {
                resolve({ found: true, status });
            } else {
                resolve({ found: false, status });
            }
        };

        serviceWorker.postMessage({ type: "LOCAL_FETCH", url, options: { method: "GET", headers } }, [channel.port2]);
    });
}

/**
 * Concurrency pool za kontrolisanu paralelizaciju.
 * Omogućava izvršavanje maksimalno N zadataka istovremeno.
 */
class ConcurrencyPool {
    private running = 0;
    private queue: Array<() => void> = [];
    private readonly maxConcurrency: number;

    constructor(maxConcurrency: number) {
        this.maxConcurrency = maxConcurrency;
    }

    async add<T>(task: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            const runTask = async () => {
                this.running++;
                try {
                    const result = await task();
                    resolve(result);
                } catch (error) {
                    reject(error);
                } finally {
                    this.running--;
                    this.processNext();
                }
            };

            this.queue.push(runTask);
            this.processNext();
        });
    }

    private processNext() {
        if (this.running >= this.maxConcurrency || this.queue.length === 0) {
            return;
        }

        const task = this.queue.shift();
        if (task) {
            task();
        }
    }
}

/**
 * Skenira mrežu za fiskalne uređaje sa kontrolisanom paralelizacijom.
 * 
 * Koristi concurrency pool da ograniči broj paralelnih requestova (default: 10).
 * Ovo dramatično ubrzava skeniranje bez preopterećenja mreže:
 * - Umesto sekvencijalnog izvršavanja (jedan po jedan)
 * - Umesto neograničene paralelizacije (svi odjednom - može preopteretiti mrežu)
 * - Koristi kontrolisanu paralelizaciju (npr. 10 istovremeno, kada se jedan završi, pokreće se sledeći)
 * 
 * @param maxConcurrency - Maksimalan broj paralelnih requestova (default: 10)
 */
export async function scanNetwork(
    serviceWorker: ServiceWorker,
    ranges: IPRange[],
    ports: number[],
    apiKey: string | undefined,
    onProgress: (progress: ScanProgress) => void,
    onDeviceFound: (device: FoundDevice) => void,
    maxConcurrency: number = 10
): Promise<FoundDevice[]> {
    const devices: FoundDevice[] = [];
    let completedScans = 0;
    let totalScans = 0;

    // Generiši listu svih zadataka (IP:port kombinacije)
    const tasks: Array<{ ip: string; port: number }> = [];
    for (const range of ranges) {
        for (let host = range.start; host <= range.end; host++) {
            for (const port of ports) {
                tasks.push({ ip: `${range.base}.${host}`, port });
                totalScans++;
            }
        }
    }

    // Kreiraj concurrency pool
    const pool = new ConcurrencyPool(maxConcurrency);

    // Dodaj sve zadatke u pool
    const promises = tasks.map(({ ip, port }) =>
        pool.add(async () => {
            completedScans++;
            onProgress({ current: completedScans, total: totalScans, currentIp: `${ip}:${port}` });

            try {
                // Prvo probaj sa API key-om (ako postoji)
                let result = await testDevice(serviceWorker, ip, port, apiKey);

                // Ako nije pronađen sa API key-om, probaj bez API key-a
                if (!result.found && apiKey) {
                    result = await testDevice(serviceWorker, ip, port);
                }

                if (result.found) {
                    console.log(`[Network Scan] ✓ Device found at ${ip}:${port}`, result);
                    const device: FoundDevice = {
                        ip,
                        port,
                        url: `http://${ip}:${port}`,
                    };
                    devices.push(device);
                    onDeviceFound(device);
                } else {
                    console.log(`[Network Scan] ✗ No device at ${ip}:${port}`);
                }
            } catch (error) {
                console.error(`[Network Scan] Error testing ${ip}:${port}`, error);
                // Ignoriši greške, nastavi skeniranje
            }
        })
    );

    // Sačekaj da se svi zadaci završe
    await Promise.all(promises);

    return devices;
}
