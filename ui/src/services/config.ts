export default {
    api: {
        baseUrl: import.meta.env.VITE_API_URL,
    },
} as const

console.log("import.meta.env.API_URL: ", import.meta.env.VITE_API_URL)
