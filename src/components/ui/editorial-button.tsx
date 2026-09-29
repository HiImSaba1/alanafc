"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type SharedProps = { label: string; variant?: "dark" | "light" | "outline"; arrow?: "left" | "right" | "up-right"; className?: string };
type LinkProps = SharedProps & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "className" | "href">;
type ButtonProps = SharedProps & { href?: never } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className">;
export type EditorialButtonProps = LinkProps | ButtonProps;

export function EditorialButton({ label, variant = "dark", arrow = "up-right", className = "", ...props }: EditorialButtonProps) {
  const icon = arrow === "left" ? <ArrowLeft /> : arrow === "right" ? <ArrowRight /> : <ArrowUpRight />;
  const classes = `editorial-button editorial-button--${variant} ${className}`.trim();
  const arrowElement = <span className="editorial-button__arrow" aria-hidden="true">{icon}</span>;
  const labelElement = <span className="editorial-button__label"><span>{label}</span><span aria-hidden="true">{label}</span></span>;
  const content = <><span className="editorial-button__fill" aria-hidden="true" />{arrow === "left" ? arrowElement : null}{labelElement}{arrow !== "left" ? arrowElement : null}</>;
  if ("href" in props && props.href) {
    const { href, ...anchorProps } = props as LinkProps;
    return <Link href={href} className={classes} {...anchorProps}>{content}</Link>;
  }
  return <button className={classes} {...props as ButtonProps}>{content}</button>;
}
