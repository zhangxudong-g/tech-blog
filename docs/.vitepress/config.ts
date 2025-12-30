import { defineConfig } from 'vitepress'

export default defineConfig({
    base: '/tech-blog/',
    title: "Owen's Tech Blog",
    description: "AI Engineering & Backend Practice",

    themeConfig: {
        nav: [
            { text: '首页', link: '/' },
            { text: 'AI 工程', link: '/ai/index' },
        ],

        sidebar: {
            '/ai/': [
                {
                    text: 'AI 工程',
                    items: [
                        { text: 'RAG 踩坑', link: '/ai/index' }
                    ]
                }
            ]
        }
    }
})
