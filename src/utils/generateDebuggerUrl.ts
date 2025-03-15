const http = require('http');

export async function generateDebuggingUrl({ ip, port }: {
    ip: string;
    port: string;
}) {
  return new Promise((resolve, reject) => {
    // Get the list of pages available for debugging
    http.get(`http://${ip}:${port}/json/list`, (res:
    any
    ) => {
      let data = '';
      
      res.on('data', (chunk:
        any
      ) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const pages = JSON.parse(data);
          if (pages.length === 0) {
            reject(new Error('No debugging targets found'));
            return;
          }
          
          // Get the first available page
          const page = pages[0];
          
          // Extract the WebSocket debugger URL 
          const webSocketDebuggerUrl = page.webSocketDebuggerUrl;
          const pageId = webSocketDebuggerUrl.split('/').pop();
          const devtoolsUrl = `http://${ip}:${port}/devtools/inspector.html?ws=${ip}:${port}/devtools/page/${pageId}`;
          
          resolve(devtoolsUrl);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (e: any) => {
      reject(e);
    });
  });
}