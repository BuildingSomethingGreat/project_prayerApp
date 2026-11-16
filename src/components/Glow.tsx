/**
 * Slow, glowing shapes that drift behind the controls to give the screen depth.
 * Pure CSS: three morphing forms, each blurred and haloed, blended as light.
 */
export function Glow({ soft = false, lively = false }: { soft?: boolean; lively?: boolean }) {
  return (
    <div className="glow" data-soft={soft} data-lively={lively} aria-hidden>
      <i />
      <i />
      <i />
    </div>
  );
}
