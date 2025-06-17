import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        id: "/",
        name: "WebBuild",
        short_name: "WebBuild",
        description: "A website builder",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff", // White background
        icons: [
            {
                src: "/assets/plura-logo.svg",
                sizes: "192x192",
                type: "image/svg+xml",
            },
            {
                src: "/assets/plura-logo-512.png",
                sizes: "512x512",
                type: "image/png", // PNG type fixed
            },
        ],
        launch_handler: {},
    };
}
