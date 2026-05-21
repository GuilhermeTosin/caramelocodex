import fs from "node:fs";

const files = [
  "src/pages/UserProfile.tsx",
  "src/pages/BusinessPage.tsx",
  "src/pages/SearchResults.tsx",
  "src/pages/Home.tsx",
  "src/components/AddressAutocomplete.tsx",
];

const replacements = [
  ["Ã¡", "á"], ["Ã ", "à"], ["Ã¢", "â"], ["Ã£", "ã"], ["Ã¤", "ä"],
  ["Ã©", "é"], ["Ã¨", "è"], ["Ãª", "ê"], ["Ã«", "ë"],
  ["Ã­", "í"], ["Ã¬", "ì"], ["Ã®", "î"], ["Ã¯", "ï"],
  ["Ã³", "ó"], ["Ã²", "ò"], ["Ã´", "ô"], ["Ãµ", "õ"], ["Ã¶", "ö"],
  ["Ãº", "ú"], ["Ã¹", "ù"], ["Ã»", "û"], ["Ã¼", "ü"],
  ["Ã", "Á"], ["Ã€", "À"], ["Ã‚", "Â"], ["Ãƒ", "Ã"], ["Ã„", "Ä"],
  ["Ã‰", "É"], ["Ãˆ", "È"], ["ÃŠ", "Ê"], ["Ã‹", "Ë"],
  ["Ã", "Í"], ["ÃŒ", "Ì"], ["ÃŽ", "Î"], ["Ã", "Ï"],
  ["Ã“", "Ó"], ["Ã’", "Ò"], ["Ã”", "Ô"], ["Ã•", "Õ"], ["Ã–", "Ö"],
  ["Ãš", "Ú"], ["Ã™", "Ù"], ["Ã›", "Û"], ["Ãœ", "Ü"],
  ["Ã§", "ç"], ["Ã‡", "Ç"],
  ["Âº", "º"], ["Âª", "ª"], ["Â·", "·"], ["Â", ""],
  ["â€œ", "\""], ["â€", "\""], ["â€˜", "'"], ["â€™", "'"], ["â€“", "-"], ["â€”", "-"], ["â€¦", "..."],
  ["ðŸ½ï¸", "🍽️"], ["ðŸ› ï¸", "🛠️"],
  ["Sin?nimos", "Sinônimos"], ["v?rgula", "vírgula"], ["jur?dico", "jurídico"], ["imigra??o", "imigração"], ["tradu??o", "tradução"],
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, "utf8");
  let next = content;
  for (const [from, to] of replacements) {
    next = next.split(from).join(to);
  }
  if (next !== content) {
    fs.writeFileSync(file, next, "utf8");
    console.log(`fixed: ${file}`);
  }
}
