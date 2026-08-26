import fs from "node:fs";

const CSS = fs.readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

function tokensDe(bloco) {
  const mapa = {};
  for (const [, nome, hex] of bloco.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    mapa[nome] = hex;
  }
  return mapa;
}

const claro = tokensDe(CSS.slice(CSS.indexOf(":root {"), CSS.indexOf(".dark {")));
const escuro = tokensDe(CSS.slice(CSS.indexOf(".dark {")));

const SUPERFICIES = ["background", "panel", "panel-raised", "panel-sunken", "sidebar"];
const TEXTOS = [
  "foreground", "muted-foreground", "copper", "fiber", "signal",
  "caution", "fault", "info", "layer2", "layer3", "layer4", "layer7",
];

function luminancia(hex) {
  const n = parseInt(hex.slice(1), 16);
  const canais = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * canais[0] + 0.7152 * canais[1] + 0.0722 * canais[2];
}

function razao(a, b) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const MINIMO = 4.5;
let falhas = 0;
let total = 0;

for (const [nomeTema, tokens] of [["claro", claro], ["escuro", escuro]]) {
  for (const texto of TEXTOS) {
    for (const superficie of SUPERFICIES) {
      const corTexto = tokens[texto];
      const corFundo = tokens[superficie];
      if (!corTexto || !corFundo) {
        console.error(`token ausente no tema ${nomeTema}: ${texto} ou ${superficie}`);
        process.exitCode = 1;
        continue;
      }
      total += 1;
      const r = razao(corTexto, corFundo);
      if (r < MINIMO) {
        falhas += 1;
        console.error(
          `${nomeTema.padEnd(7)} ${texto.padEnd(18)} sobre ${superficie.padEnd(13)} ${r.toFixed(2)}  (precisa ${MINIMO.toFixed(2)})`,
        );
      }
    }
  }
}

const ACENTOS = [
  "copper", "fiber", "signal", "caution", "fault", "info",
  "layer2", "layer3", "layer4", "layer7",
  "vlan-10", "vlan-20", "vlan-30", "vlan-40",
];
const SOBRE_ACENTO = ["background", "panel"];

for (const [nomeTema, tokens] of [["claro", claro], ["escuro", escuro]]) {
  for (const texto of SOBRE_ACENTO) {
    for (const acento of ACENTOS) {
      const corTexto = tokens[texto];
      const corFundo = tokens[acento];
      if (!corTexto || !corFundo) continue;
      total += 1;
      const r = razao(corTexto, corFundo);
      if (r < MINIMO) {
        falhas += 1;
        console.error(
          `${nomeTema.padEnd(7)} ${texto.padEnd(18)} sobre ${acento.padEnd(13)} ${r.toFixed(2)}  (precisa ${MINIMO.toFixed(2)})`,
        );
      }
    }
  }
}

console.log(`\n${total - falhas}/${total} pares passam em ${MINIMO}:1.`);
if (falhas > 0) process.exitCode = 1;
