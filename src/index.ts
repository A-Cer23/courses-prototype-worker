import { Hono } from 'hono'


type Bindings = {
  GITHUB_AUTH_TOKEN: string
  REPO_URL: string
}


const app = new Hono<{ Bindings: Bindings }>()

app.get('/', async (c) => {

  const response = await fetch(c.env.REPO_URL, {
    method: 'GET',
    headers: {
      "User-Agent": "hono",
      "Accepts": "application/vnd.github.raw+json",
      "Authorization": `Bearer ${c.env.GITHUB_AUTH_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28'
    },
  })

  return c.text(JSON.stringify(await response.json(), null, 2))
})

export default app
