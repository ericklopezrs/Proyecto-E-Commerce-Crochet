import asyncio
from fastmcp import Client

URL = "https://proyecto-e-commerce-crochet.onrender.com/mcp-ZsE0mi4wU7dt9ULfo8xSEGa87lXsDu-T/mcp"

async def main():
    async with Client(URL) as c:
        print([t.name for t in await c.list_tools()])
        print(await c.call_tool("productos_mas_vendidos", {"limite": 3}))

asyncio.run(main())