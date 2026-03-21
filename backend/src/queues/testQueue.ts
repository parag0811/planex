import { aiQueue } from "./aiQueue"; 

async function addJob() {
  await aiQueue.add("test-job", {
    message: "Hello from BullMQ",
  });

  console.log("Job added");
}

addJob();