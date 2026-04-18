// D:\eidomancer\src\lib\formatImage.js

export function getFormatInstructions(type) {
  switch (type) {
    case "CORE":
      return "Tarot card style, vertical, ornate border, no extra text beyond card title.";
      
    case "SUNO":
      return "Tarot-style album cover, vertical, include song title at bottom, stylized text.";

    case "ECHO":
      return "Wide cinematic image, no border, no title, include one short phrase embedded naturally.";

    case "SPECTERR":
      return `
      16:9 widescreen.
      Inner image scaled to 85%.
      Large outer margins on all sides.
      Dark simple border.
      Title centered at bottom like album cover.
      Keep all important content away from edges.
      `;

    default:
      return "";
  }
}