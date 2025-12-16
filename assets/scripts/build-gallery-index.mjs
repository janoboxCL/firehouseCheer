import { promises as fs } from "fs";
import path from "path";

const rootDir = path.resolve("assets/img");
const galleryRoot = path.join(rootDir, "galeria");
const outputFile = path.join(rootDir, "gallery-index.json");

const isImage = (file) => /(\.png|\.jpe?g|\.webp|\.gif)$/i.test(file);

async function ensureGalleryRoot() {
    try {
        const stats = await fs.stat(galleryRoot);
        if (!stats.isDirectory()) {
            throw new Error("La ruta de galería no es un directorio");
        }
    } catch (err) {
        if (err.code === "ENOENT") {
            await fs.mkdir(galleryRoot, { recursive: true });
            return [];
        }
        throw err;
    }
}

function humanizeName(folderName) {
    const clean = folderName.replace(/_/g, " ");
    return clean.replace(/\b(\w)/g, (match) => match.toUpperCase());
}

async function buildManifest() {
    await ensureGalleryRoot();
    const entries = await fs.readdir(galleryRoot, { withFileTypes: true });

    const galleries = await Promise.all(entries
        .filter((entry) => entry.isDirectory())
        .map(async (dir) => {
            const dirPath = path.join(galleryRoot, dir.name);
            const files = await fs.readdir(dirPath);
            const images = files
                .filter(isImage)
                .map((file) => path.join("assets/img/galeria", dir.name, file).replace(/\\/g, "/"));

            return {
                id: dir.name,
                name: humanizeName(dir.name),
                count: images.length,
                images,
            };
        }));

    const manifest = {
        generatedAt: new Date().toISOString(),
        galleries: galleries.sort((a, b) => a.id.localeCompare(b.id)),
    };

    await fs.writeFile(outputFile, JSON.stringify(manifest, null, 2), "utf8");
    console.log(`Galería generada en ${outputFile}`);
}

buildManifest().catch((err) => {
    console.error("Error al generar el índice de galería", err);
    process.exit(1);
});
