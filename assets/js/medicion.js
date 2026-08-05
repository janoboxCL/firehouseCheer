/* ============================================================
   MEDICIÓN DE CONVERSIÓN — GA4
   Se carga en TODAS las páginas del sitio. Delegación de
   eventos: captura también los enlaces que se agreguen después.
   ============================================================ */
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href]");
  if (!a || typeof gtag !== "function") return;

  const href = a.getAttribute("href") || "";
  const seccion = (a.closest("section") && a.closest("section").id) || "sin-seccion";
  const etiqueta = (a.textContent || "").trim().slice(0, 60);
  const pagina = location.pathname;

  if (href.includes("wa.me")) {
    const marcador = decodeURIComponent(href).match(/\[([\w-]+)\]/);
    gtag("event", "click_whatsapp", {
      ubicacion: seccion,
      origen: marcador ? marcador[1] : "sin-marcador",
      pagina: pagina,
      etiqueta: etiqueta
    });
  } else if (href.startsWith("tel:")) {
    gtag("event", "click_telefono", { ubicacion: seccion, pagina: pagina });
  } else if (href.includes("forms.gle") || href.includes("docs.google.com/forms")) {
    gtag("event", "click_formulario", { ubicacion: seccion, pagina: pagina });
  } else if (href.includes("instagram.com")) {
    gtag("event", "click_instagram", { ubicacion: seccion, pagina: pagina });
  }
});

/* Profundidad de lectura: señal de interés real */
(() => {
  let disparado = false;
  window.addEventListener("scroll", () => {
    if (disparado) return;
    const avance = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
    if (avance >= 0.9) {
      disparado = true;
      if (typeof gtag === "function") gtag("event", "scroll_90", { pagina: location.pathname });
    }
  }, { passive: true });
})();
