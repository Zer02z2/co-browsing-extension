export default {
  build: {
    assetsDir: "",
    rollupOptions: {
      input: {
        main: "/index.html",
        inject: "/src/inject.ts",
        background: "/src/background.ts",
        content: "/src/content.ts",
      },
      output: {
        dir: "../chrome-extension",
        entryFileNames: "[name].js",
      },
    },
  },
}
