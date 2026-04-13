import { iaPoliciesData, iaPoliciesFooter } from "../../data/iaPoliciesData";
import "../../Sections/TermsAndConditions/termsAndCondition.css";
import "./IaPolicies.css";

const IaPoliciesMain = () => {
  return (
    <section
      id="ia-policies"
      className="terms-list-container"
      style={{ marginTop: "-6rem" }}
    >
      <ul className="terms-list">
        {iaPoliciesData.map((policy, index) => (
          <li
            key={index}
            className="term-item"
          >
            {policy.content}

            {policy.paragraphs && policy.paragraphs.map((p, pIndex) => (
              <p key={`p-${index}-${pIndex}`} className="ia-paragraph" style={{ whiteSpace: "pre-line" }}>
                {p}
              </p>
            ))}

            {policy.subItems && (
              <ol className="ia-sub-list">
                {policy.subItems.map((sub, sIndex) => (
                  <li key={`sub-${index}-${sIndex}`} className="ia-sub-item">
                    <span className="ia-sub-item-title">{sub.title}</span>
                    <p className="ia-paragraph" style={{ whiteSpace: "pre-line", marginTop: "5px" }}>
                      {sub.text}
                    </p>
                  </li>
                ))}
              </ol>
            )}

            {policy.bullets && (
              <ul className="ia-bullet-list">
                {policy.bullets.map((bullet, bIndex) => (
                  <li key={`b-${index}-${bIndex}`}>
                    {bullet}
                  </li>
                ))}
              </ul>
            )}

            {policy.paragraphsBottom && policy.paragraphsBottom.map((p, pIndex) => (
              <p key={`pb-${index}-${pIndex}`} className="ia-paragraph" style={{ whiteSpace: "pre-line" }}>
                {p}
              </p>
            ))}

            {policy.bulletsBottom && (
              <ul className="ia-bullet-list">
                {policy.bulletsBottom.map((bullet, bIndex) => (
                  <li key={`bb-${index}-${bIndex}`}>
                    {bullet}
                  </li>
                ))}
              </ul>
            )}

            {policy.paragraphsFinal && policy.paragraphsFinal.map((p, pIndex) => (
              <p key={`pf-${index}-${pIndex}`} className="ia-paragraph" style={{ whiteSpace: "pre-line" }}>
                {p}
              </p>
            ))}

            {policy.subcontent && (
              <ul className="subterm-list">
                {policy.subcontent.map((subpolicy, subIndex) => (
                  <li
                    key={subIndex}
                    className="subterm-item"
                  >
                    {subpolicy.content}

                    {subpolicy.subcontent && (
                      <ul className="subsubterm-list">
                        {subpolicy.subcontent.map((subSubPolicy, subSubIndex) => (
                          <li key={subSubIndex} className="subsubterm-item">{subSubPolicy.content}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      {iaPoliciesFooter}
    </section>
  );
};

export default IaPoliciesMain;
