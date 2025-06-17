export default function DocumentationLayout() {
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
            Documentation
          </h1>
          <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
            Everything you need to build, deploy, and manage your site with our platform.
          </p>
  
          <div>
            <h2 style={{ color: '#58a6ff' }}>Getting Started</h2>
            <p>Learn how to create your first project and publish your website.</p>
  
            <h2 style={{ color: '#58a6ff', marginTop: '1.5rem' }}>Customizing</h2>
            <p>Use our drag-and-drop tools or custom code options to tailor your site.</p>
  
            <h2 style={{ color: '#58a6ff', marginTop: '1.5rem' }}>Deployment</h2>
            <p>Deploy to a custom domain or use our free *.webapp.site subdomain.</p>
          </div>
        </div>
      </div>
    )
  }
  