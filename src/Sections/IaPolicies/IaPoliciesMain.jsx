import { iaPoliciesData } from "../../data/iaPoliciesData";
import "../../Sections/TermsAndConditions/termsAndCondition.css";

const IaPoliciesMain = () => {
  return (
    <section
      id="ia-policies"
      className="terms-list-container"
    >
      <ul className="terms-list">
        {iaPoliciesData.map((policy, index) => (
          <li
            key={index}
            className="term-item"
          >
            {policy.content}
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
    </section>
  );
};

export default IaPoliciesMain;
