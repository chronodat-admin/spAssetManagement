/** Replace `{key}` placeholders in translated strings. */
export function formatMessage(
  template: string,
  vars: Record<string, string | number | undefined>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = vars[key];
    return value === undefined || value === null ? `{${key}}` : String(value);
  });
}
