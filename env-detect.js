


export function getEnvironmentType() {
    const host = location.hostname;
    if (host.includes("github.io")) return "github";
    if (host.includes("cgm.cs.mcgill.ca")) return "cgm";
    return "dev";
}