'use client';

import { useEffect } from 'react';
import PublicTopNav from '../components/public-top-nav';

export default function TeachersPage() {
  useEffect(() => {
    document.documentElement.dataset.theme = 'light';
  }, []);

  useEffect(() => {
    document.title = 'Students | Simply Music';
  }, []);

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <PublicTopNav activeHref="/simplymusic/students" />
      <section
        style={{
          maxWidth: 1170,
          margin: '0 auto',
          padding: '64px 24px 80px',
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 0.9fr) minmax(300px, 1.3fr)',
          alignItems: 'center',
          gap: 48,
        }}
      >
        <div style={{ position: 'relative' }}>
          <h1 style={{ margin: 0, fontSize: 56, fontWeight: 300, lineHeight: '1.15' }}>
            Being A Simply Music Student
          </h1>
          <p style={{ marginTop: 36, fontSize: 24, lineHeight: '1.6', maxWidth: 420 }}>
            A new way to learn piano
          </p>
          <img
            src="https://simplymusic.com/wp-content/uploads/2024/07/numbers-of-houses.png"
            alt=""
            style={{
              position: 'absolute',
              left: 'calc(-1 * (100vw - 100%) / 2 + 346px)',
              bottom: -300,
              width: 'auto',
              maxWidth: 'none',
              pointerEvents: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <img
            src="https://simplymusic.com/wp-content/uploads/2024/07/two-person-playing-piano-on-ground.png"
            alt="Teacher Banner"
            style={{ width: '100%', maxWidth: 860 }}
          />
        </div>
      </section>

      <section
        style={{
          maxWidth: 1170,
          margin: '0 auto',
          padding: '215px 24px 80px',
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 1fr) minmax(320px, 1.1fr)',
          alignItems: 'center',
          gap: 48,
        }}
      >
        <div>
          <img
            src="/reference/students-program-card.png"
            alt="Our piano program"
            style={{
              width: '100%',
              maxWidth: 520,
              borderRadius: 24,
              display: 'block',
            }}
          />
        </div>
        <div style={{ maxWidth: 560 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 46,
              fontWeight: 300,
              lineHeight: '1.3',
              whiteSpace: 'nowrap',
            }}
          >
            Our Piano Program
          </h2>
          <p
            style={{
              marginTop: 18,
              fontSize: 26,
              lineHeight: '1.6',
              maxWidth: 560,
              whiteSpace: 'nowrap',
            }}
          >
            All human beings, without exception,
            <br />
            are deeply and naturally musical
          </p>
          <p style={{ marginTop: 18, fontSize: 18, lineHeight: '1.8', maxWidth: 560 }}>
            In the same way that we all learn to speak years before we learn to read and
            spell, Simply Music temporarily delays music reading and immerses students in
            the experience of immediately playing great-sounding music.
          </p>
          <p style={{ marginTop: 18, fontSize: 18, lineHeight: '1.8', maxWidth: 560 }}>
            Our unique method replaces traditional music reading with engaging play-based
            concepts directly on the keyboard. This leads students to quickly build a
            repertoire of 35-50 pieces within the first year, all while fostering a
            natural love for music. Music reading is introduced later, ensuring strong
            skills while prioritizing a fun and effective approach.
          </p>
        </div>
      </section>

      <section
        style={{
          maxWidth: 1170,
          margin: '0 auto',
          padding: '100px 24px 80px',
        }}
      >
        <div
          style={{
            background: '#9cad08',
            borderRadius: 18,
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 0.7fr) minmax(320px, 1.4fr) auto',
            alignItems: 'center',
            gap: 32,
            padding: '32px 36px 32px 260px',
            color: '#ffffff',
            position: 'relative',
            overflow: 'visible',
            minHeight: 250,
          }}
        >
          <img
            src="https://simplymusic.com/wp-content/uploads/2024/07/sky-scrapper-illustration.png"
            alt=""
            style={{
              position: 'absolute',
              left: -20,
              bottom: -28,
              width: 'auto',
              height: 'auto',
            }}
          />
          <div
            style={{
              marginLeft: 140,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                textAlign: 'left',
              }}
            >
              Ready to start Simply Music Lessons
            </h3>
            <a
              href="/simplymusic/locator"
              style={{
                background: '#ffffff',
                color: '#6f7a12',
                borderRadius: 12,
                padding: '10px 16px',
                fontWeight: 600,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                width: 200,
                textAlign: 'center',
              }}
            >
              Locate A Teacher
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
