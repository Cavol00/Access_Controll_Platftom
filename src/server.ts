import { app } from "./app.js";
import { config } from "./config.js";

app.listen(config.port, () => console.log(`
Server avviato su http://localhost:${config.port}`
));