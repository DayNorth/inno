// Comprueba el index.html prerenderizado del build de la SPA.
//
// Existe por un fallo real: un `entry.server.tsx` con `renderToString` no
// soporta el <Suspense> que monta <ServerRouter>, asi que el payload de
// hidratacion se emitia como un mensaje de error dentro del HTML. La app
// arrancaba y se quedaba clavada en el HydrateFallback para siempre.
//
// Typecheck, lint, los 139 tests y el propio build estaban en verde. Nada de
// eso mira el documento que recibe el navegador; esto si.
import { readFileSync } from "node:fs";

const RUTA = "build/client/index.html";

const PROHIBIDO = [
  ["does not support Suspense", "renderToString en entry.server.tsx"],
  ["Minified React error", "error de React durante el prerender"],
  ["<template data-cstck", "React incrusto un error en el documento"],
];

const OBLIGATORIO = [
  ["__reactRouterContext", "el contexto de hidratacion del router"],
  ['type="module"', "el script de entrada del cliente"],
  ["<!DOCTYPE html>", "el doctype"],
];

let html;
try {
  html = readFileSync(RUTA, "utf8");
} catch {
  console.error(`No existe ${RUTA}. Ejecuta primero \`npm run build\`.`);
  process.exit(1);
}

const fallos = [];

for (const [aguja, motivo] of PROHIBIDO) {
  if (html.includes(aguja)) fallos.push(`Contiene "${aguja}" — ${motivo}.`);
}

for (const [aguja, motivo] of OBLIGATORIO) {
  if (!html.includes(aguja)) fallos.push(`Falta ${motivo} ("${aguja}").`);
}

if (fallos.length > 0) {
  console.error("El index.html prerenderizado no sirve para arrancar la SPA:\n");
  for (const f of fallos) console.error(`  · ${f}`);
  process.exit(1);
}

console.log(`${RUTA} correcto (${html.length} bytes).`);
