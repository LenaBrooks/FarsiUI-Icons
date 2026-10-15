import { forwardRef } from "react";
import type { Ref } from "react";
import { createIcon } from "./create-icon";
import type { IconProps, IconVariant, IconVariantData } from "./types";

function resolveVariant(variant: IconVariant | undefined): IconVariant {
  return variant === "mono" ? "mono" : "color";
}

/**
 * Factory for persian-labs icons. Supports `variant="color" | "mono"`.
 */
export function createPersianLabsIcon(
  id: string,
  displayName: string,
  variants: IconVariantData,
) {
  if (!variants?.color || !variants?.mono) {
    throw new Error(`Invalid persian-labs icon data: ${id}`);
  }

  const ColorIcon = createIcon({
    displayName: `${displayName}Color`,
    viewBox: variants.color.viewBox,
    markup: variants.color.body,
  });

  const MonoIcon = createIcon({
    displayName: `${displayName}Mono`,
    viewBox: variants.mono.viewBox,
    markup: variants.mono.body,
  });

  const Icon = forwardRef(function PersianLabsIcon(
    props: IconProps,
    ref: Ref<SVGSVGElement>,
  ) {
    const variant = resolveVariant(props.variant);
    const { variant: _variant, ...rest } = props;
    const Comp = variant === "mono" ? MonoIcon : ColorIcon;
    return <Comp ref={ref} {...rest} />;
  });

  Icon.displayName = displayName;
  return Icon;
}
