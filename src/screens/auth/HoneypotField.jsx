/**
 * Campo oculto anti-bot. Los password managers ignoran el name "website"
 * si van los data-*-ignore; sin eso un autofill silencioso rechaza el submit.
 */
const HoneypotField = ({ value, onChange }) => (
  <input
    type="text"
    name="website"
    tabIndex={-1}
    autoComplete="off"
    autoCorrect="off"
    autoCapitalize="none"
    spellCheck={false}
    aria-hidden="true"
    data-1p-ignore="true"
    data-bwignore="true"
    data-lpignore="true"
    data-form-type="other"
    value={value}
    onChange={onChange}
    style={{
      position: "absolute",
      left: "-9999px",
      top: "auto",
      width: "1px",
      height: "1px",
      overflow: "hidden",
      opacity: 0,
    }}
  />
);

export default HoneypotField;
