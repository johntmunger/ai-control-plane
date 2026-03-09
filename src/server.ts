import express from "express";
import chatRoutes from "./api/chat";

const app = express();

app.use(express.json());
app.use("/api", chatRoutes);

app.listen(process.env.PORT || 3000, () => {
  console.log("AI runtime listening...");
});
