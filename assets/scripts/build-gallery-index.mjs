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
        }
    }
}

function humanizeName(folderName) {
    const clean = folderName.replace(/_/g, " ");
    return clean.replace(/\b(\w)/g, (match) => match.toUpperCase());
}

async function readCurrentManifest() {
    try {
        const content = await fs.readFile(outputFile, "utf8");
        return JSON.parse(content);
    } catch (err) {
        if (err.code === "ENOENT") return null;
        throw err;
    }
}

async function buildManifest() {
    await ensureGalleryRoot();
    const entries = await fs.readdir(galleryRoot, { withFileTypes: true });

    const galleries = await Promise.all(entries
        .filter((entry) => entry.isDirectory())
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(async (dir) => {
            const dirPath = path.join(galleryRoot, dir.name);
            const files = await fs.readdir(dirPath);
            const images = files
                .filter(isImage)
                .sort((a, b) => a.localeCompare(b))
                .map((file) => path.join("assets/img/galeria", dir.name, file).replace(/\\/g, "/"));

            return {
                id: dir.name,
                name: humanizeName(dir.name),
                count: images.length,
                images,
            };
        }));

    const manifest = {
        galleries: galleries.sort((a, b) => a.id.localeCompare(b.id)),
    };

    const currentManifest = await readCurrentManifest();
    if (JSON.stringify(currentManifest) === JSON.stringify(manifest)) {
        console.log("Galería sin cambios. No se actualiza gallery-index.json");
        return;
    }

    await fs.writeFile(outputFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    console.log(`Galería generada en ${outputFile}`);
}

buildManifest().catch((err) => {
    console.error("Error al generar el índice de galería", err);
    process.exit(1);
});
