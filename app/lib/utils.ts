export function cn(...inputs: (string | undefined | null | false | { [key: string]: any })[]) {
  return inputs
    .flatMap((input) => {
      if (!input) return [];
      if (typeof input === "string") return input.split(" ");
      return Object.entries(input)
        .filter(([_, value]) => value)
        .map(([key]) => key);
    })
    .join(" ");
}
