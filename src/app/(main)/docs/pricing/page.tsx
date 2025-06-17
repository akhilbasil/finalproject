export default function PricingLayout() {
    return (
      <div style={{
        backgroundColor: '#0d1117',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        padding: '2rem',
        minHeight: '100vh',
      }}>
        <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
          <h1 style={{
            fontSize: '2.5rem',
            marginBottom: '1.5rem',
            borderBottom: '2px solid #1f6feb',
            paddingBottom: '0.5rem'
          }}>
            Pricing
          </h1>
          <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
            Choose a plan that fits your needs. No hidden fees. Cancel anytime.
          </p>
  
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '1.5rem',
          }}>
            {[
              { name: 'Starter Pack', price: '$0/mo', features: ['3 Sub accounts', '2 Team members', 'Unlimited pipelines'] },
              { name: 'Unlimited Saas', price: '$100/mo', features: ['Rebilling', '24/7 Support team'] },
              { name: 'Basic', price: '$50/mo', features: ['Unlimited SubAccounts', 'Unlimited Team members'] }
            ].map((plan) => (
              <div key={plan.name} style={{
                backgroundColor: '#161b22',
                padding: '1rem',
                borderRadius: '0.5rem',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
              }}>
                <h2 style={{ color: '#58a6ff' }}>{plan.name}</h2>
                <h3 style={{ margin: '0.5rem 0' }}>{plan.price}</h3>
                <ul>
                  {plan.features.map((f, i) => (
                    <li key={i}>✓ {f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  