import React from 'react';

export default function AboutLayout() {
  return (
    <div
      style={{
        backgroundColor: '#121212', // Dark background color
        color: '#f1f1f1', // Light text color
        padding: '40px',
        minHeight: '100vh',
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          fontSize: '3rem',
          color: '#ffffff',
          marginBottom: '20px',
        }}
      >
        About Us
      </h1>
      <p
        style={{
          fontSize: '1.1rem',
          color: '#d1d1d1',
          marginBottom: '40px',
        }}
      >
        Welcome to our website! We are a talented and dedicated team of
        developers working together to create amazing experiences for you. Below
        are the members of our team and their roles:
      </p>

      <h2
        style={{
          fontSize: '2rem',
          color: '#1e90ff', // Dark blue accent color
          marginBottom: '30px',
        }}
      >
        Meet Our Team
      </h2>
      <ul
        style={{
          listStyle: 'none',
          paddingLeft: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          margin: '0 auto',
          maxWidth: '900px',
        }}
      >
        <li
          style={{
            backgroundColor: '#1c1c1c', // Dark card background
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
            transition: 'background-color 0.3s ease',
          }}
        >
          <h3
            style={{
              fontSize: '1.6rem',
              color: '#1e90ff',
              marginBottom: '10px',
            }}
          >
            Akhil Basil Paulose
          </h3>
          <p>
            <strong style={{ color: '#1e90ff' }}>Role:</strong> Frontend Developer
          </p>
          <p>
            Akhil is passionate about crafting intuitive and dynamic user
            interfaces. He works on designing and building the frontend of our
            applications, ensuring they are visually appealing and user-friendly.
          </p>
        </li>
        <li
          style={{
            backgroundColor: '#1c1c1c',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
            transition: 'background-color 0.3s ease',
          }}
        >
          <h3
            style={{
              fontSize: '1.6rem',
              color: '#1e90ff',
              marginBottom: '10px',
            }}
          >
            Akish Babu Abraham
          </h3>
          <p>
            <strong style={{ color: '#1e90ff' }}>Role:</strong> Backend Developer
          </p>
          <p>
            Akish is responsible for developing the server-side logic, APIs, and
            managing databases to ensure seamless functionality for our web
            applications.
          </p>
        </li>
        <li
          style={{
            backgroundColor: '#1c1c1c',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
            transition: 'background-color 0.3s ease',
          }}
        >
          <h3
            style={{
              fontSize: '1.6rem',
              color: '#1e90ff',
              marginBottom: '10px',
            }}
          >
            Albin Nelson
          </h3>
          <p>
            <strong style={{ color: '#1e90ff' }}>Role:</strong> Full-stack
            Developer
          </p>
          <p>
            Albin brings a diverse skill set to the table, working on both
            frontend and backend. His goal is to ensure smooth communication
            between the server and the user interface.
          </p>
        </li>
        <li
          style={{
            backgroundColor: '#1c1c1c',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
            transition: 'background-color 0.3s ease',
          }}
        >
          <h3
            style={{
              fontSize: '1.6rem',
              color: '#1e90ff',
              marginBottom: '10px',
            }}
          >
            Alvin Siby
          </h3>
          <p>
            <strong style={{ color: '#1e90ff' }}>Role:</strong> UX/UI Designer
          </p>
          <p>
            Alvin is focused on the visual design and user experience of our
            web applications. He ensures our interfaces are both beautiful and
            functional, with a strong focus on usability.
          </p>
        </li>
      </ul>

      <p
        style={{
          fontSize: '1.2rem',
          color: '#d1d1d1',
          textAlign: 'center',
          marginTop: '40px',
        }}
      >
        Our team is committed to delivering high-quality products and
        continuously improving our skills to provide the best possible experience
        for our users.
      </p>

      {/* Render any additional children passed to the layout */}
    </div>
  );
}
