/**
 * Edits a controlled input the way a user would: React only reacts to the
 * `input` event when the value changed through the prototype's native setter
 * (it shadows the instance `value` property to track edits).
 */
export function setInputValue(input: HTMLInputElement, value: string) {
  const set = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  if (!set) throw new Error("HTMLInputElement value setter not found");
  set.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}
