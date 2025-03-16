interface validateClientDataType {
  data: Record<string, string>;
  requiredProps: string[];
}

export function validateClientData({
  data,
  requiredProps,
}: validateClientDataType) {
  const missingProps = requiredProps.filter((prop) => !data[prop]);
  return { missingProps };
}
