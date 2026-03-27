import { aiQueue } from "./aiQueue"; 

async function addJob() {
  const job = await aiQueue.add("test-job", {
    message: "Hello AI",
  });

  console.log("Job ID:", job.id);
}

addJob();