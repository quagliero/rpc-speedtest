export const scrollToBottom = () => {
  const element = document.documentElement;

  element.scrollIntoView({ block: "end" });
};
