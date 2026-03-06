export function logInvocation(id: string, tool: string, args: unknown) {
  console.error(
    JSON.stringify({
      type: "invocation",
      id,
      tool,
      args,
      timestamp: Date.now(),
    }),
  );
}
