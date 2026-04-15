export function TracePanel({ trace }: any) {
  return (
    <div style={styles.panel}>
      <div style={styles.title}>Execution Trace</div>

      {trace.map((event: any, i: number) => (
        <TraceEventCard key={i} event={event} index={i} />
      ))}
    </div>
  );
}

