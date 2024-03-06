import { Hono } from 'hono'
import {Octokit} from "octokit";
import { VFile } from "vfile";
import { matter } from "vfile-matter";


type Bindings = {
  GITHUB_AUTH_TOKEN: string
  OWNER: string
  REPO: string
  PATH: string
}


const app = new Hono<{ Bindings: Bindings }>()

app.get('/', async (c) => {

  // Create an instance of the Octokit API
  const octokit = new Octokit({
    auth: c.env.GITHUB_AUTH_TOKEN
  })


  // Get the list of directories within the routes directory in the repo
  const dirs = await octokit.rest.repos.getContent({
    owner: c.env.OWNER,
    repo: c.env.REPO,
    path: c.env.PATH,
  }).then(res => res.data)


  // Go through each directory and grab the mdx files from the repo
  let contents = await Promise.all(dirs.map(async (dir) => {
    const response = await octokit.rest.repos.getContent({
      owner: c.env.OWNER,
      repo: c.env.REPO,
      path: dir.path
    })

    // Returns the mdx files in the directory
    return response.data
  }))


  // Flatten the array to have all mdx files in one array
  contents = contents.flat()


  // Get the raw data of the mdx files
  const rawData = await Promise.all(contents.map(async (file) => {

    // Get the raw text of the mdx file
    let rawText = await fetch(file.download_url).then(res => res.text())

    // Create a vFile and parse the matter to retrieve mdx properties
    const vFile = new VFile(rawText);
    matter(vFile);
    const {title, author} = vFile.data.matter as {title: string, author: string};

    // Remove the properties from the mdx text
    rawText = rawText.split('---').slice(2).join('---').trim();

    // Replace a file's path to only contain the directory as a route
    // Removes "routes/" and `${filename}.mdx`
    const textsToDelete = ["routes/", /\/[\w-]+\.mdx/g];
    textsToDelete.forEach(text => {
      file.path = file.path.replace(text, "")
    })

    // Return the title, author, route, and content of the mdx file
    return {title, author, route: file.path, content: rawText}
  }));


  return c.json(rawData)
})

export default app
