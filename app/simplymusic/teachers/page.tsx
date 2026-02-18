'use client';

import { useEffect } from 'react';
import PublicTopNav from '../components/public-top-nav';

export default function TeachersPage() {
  useEffect(() => {
    document.documentElement.dataset.theme = 'light';
  }, []);

  useEffect(() => {
    document.title = 'Teachers | Simply Music';
  }, []);

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <PublicTopNav activeHref="/simplymusic/teachers" />
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
            Being A Simply
            <br />
            Music Teacher
          </h1>
          <p style={{ marginTop: 36, fontSize: 24, lineHeight: '1.6', maxWidth: 420 }}>
            A revolutionary approach that
            <br />
            redefines music education
          </p>
          <img
            src="https://simplymusic.com/wp-content/uploads/2024/07/SM-teacher-bg.png"
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
            src="https://simplymusic.com/wp-content/uploads/2024/07/Teacher-P-Banner.png"
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
            src="/reference/teacher-training-card.png"
            alt="Teacher Training Program"
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
            Teacher Training Program
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
            Join the global community of Simply Music Teachers
          </p>
          <p style={{ marginTop: 18, fontSize: 18, lineHeight: '1.8', maxWidth: 560 }}>
            Getting started as a Simply Music Teacher begins with successfully completing
            our Initial Teacher Training Program. We provide you with everything you need
            to get started and successfully teach our program. Our promise is to astound
            you with value that is far beyond the cost.
          </p>
          <p style={{ marginTop: 18, fontSize: 18, lineHeight: '1.8', maxWidth: 560 }}>
            Watch the video to hear Simply Music’s Founder, Neil Moore, talk about the
            Initial Teacher Training Program and what’s involved.
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
            columnGap: 32,
            color: '#ffffff',
            position: 'relative',
            overflow: 'visible',
            minHeight: 250,
          }}
        >
          <img
            src="https://simplymusic.com/wp-content/uploads/2024/03/SM-Teacher-graphic.png"
            alt=""
            style={{
              position: 'absolute',
              left: -100,
              bottom: -88,
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
              Find out more about teaching Simply Music
            </h3>
            <a
              href="/embed/lead-form"
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
              Set Up A Call
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
