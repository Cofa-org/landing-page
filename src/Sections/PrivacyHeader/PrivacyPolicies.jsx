import { privacyPolicies } from "../../data/info"
import "./privacyPolicies.css"

const PrivacyPolicies = () => {
    return (
        <section id='policies' className='policies-list-container'>
            {
                privacyPolicies.map((policy) =>(
                    <div className='policies-list'>
                        <h2>{policy.title}</h2>
                        <p>{policy.content}</p>
                    </div>
                ))
            }
        </section>
    )
}


export default PrivacyPolicies