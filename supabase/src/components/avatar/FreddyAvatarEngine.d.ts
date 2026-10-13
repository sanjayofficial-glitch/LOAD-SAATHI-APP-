export interface CreateAvatarOptions {
  name: string;
  size?: number | string;
  animation?: string;
}

export function createAvatar(
  target: HTMLElement | string,
  options?: CreateAvatarOptions
): void;
