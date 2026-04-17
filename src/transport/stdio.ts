import readline from "node:readline";
import { handlePolicyRequest } from "../runtime/policy";
import { executeKernel } from "../runtime/kernel";
import { orchestrate } from "../runtime/orchestrator";
import { createTrace } from "../runtime/trace";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", async (line) => {
  let input;

  try {
    input = JSON.parse(line);
  } catch {
    process.stdout.write(
      JSON.stringify({
        error: {
          type: "invalid_json",
          message: "Malformed JSON request",
        },
      }) + "\n",
    );
    return;
  }

  if ("tool" in input) {
    const response = await handlePolicyRequest(input);

    process.stdout.write(JSON.stringify(response) + "\n");

    return;
  }

  if ("prompt" in input) {
    const trace = createTrace();
    const kernelInput = await orchestrate(input.prompt, trace);
    const response = await executeKernel(kernelInput, trace);

    process.stdout.write(JSON.stringify(response) + "\n");

    return;
  }
});
