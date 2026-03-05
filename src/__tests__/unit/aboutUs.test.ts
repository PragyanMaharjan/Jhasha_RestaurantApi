import { describe, test, expect, beforeEach } from '@jest/globals';
import AboutUs from '../../models/AboutUs';

describe('AboutUs Model', () => {
  let aboutUsData: any;

  beforeEach(() => {
    aboutUsData = {
      title: 'About Jhasha Restaurant',
      description: 'We serve authentic Nepalese cuisine with fresh ingredients and traditional recipes.',
      image: 'https://example.com/about.jpg',
      vision: 'To become the leading Nepalese restaurant in the region',
      mission: 'Provide authentic and delicious Nepalese food with excellent service',
      contact: {
        phone: '+977-1234567890',
        email: 'info@jhasha.com',
        address: '123 Main Street, Kathmandu'
      },
      socialMedia: {
        facebook: 'https://facebook.com/jhasha',
        instagram: 'https://instagram.com/jhasha',
        twitter: 'https://twitter.com/jhasha'
      },
      teamMembers: [
        {
          name: 'Ram Singh',
          position: 'Chef',
          bio: 'Head chef with 20 years experience'
        }
      ],
      highlights: [
        'Authentic recipes',
        'Fresh ingredients',
        'Friendly staff'
      ]
    };
  });

  test('should create a new AboutUs document with all fields', () => {
    const aboutUs = new AboutUs(aboutUsData);

    expect(aboutUs.title).toBe(aboutUsData.title);
    expect(aboutUs.description).toBe(aboutUsData.description);
    expect(aboutUs.image).toBe(aboutUsData.image);
    expect(aboutUs.vision).toBe(aboutUsData.vision);
    expect(aboutUs.mission).toBe(aboutUsData.mission);
  });

  test('should create a new AboutUs document with contact info', () => {
    const aboutUs = new AboutUs(aboutUsData);

    expect(aboutUs.contact.phone).toBe(aboutUsData.contact.phone);
    expect(aboutUs.contact.email).toBe(aboutUsData.contact.email);
    expect(aboutUs.contact.address).toBe(aboutUsData.contact.address);
  });

  test('should create a new AboutUs document with social media links', () => {
    const aboutUs = new AboutUs(aboutUsData);

    expect(aboutUs.socialMedia.facebook).toBe(aboutUsData.socialMedia.facebook);
    expect(aboutUs.socialMedia.instagram).toBe(aboutUsData.socialMedia.instagram);
    expect(aboutUs.socialMedia.twitter).toBe(aboutUsData.socialMedia.twitter);
  });

  test('should create a new AboutUs document with team members', () => {
    const aboutUs = new AboutUs(aboutUsData);

    expect(aboutUs.teamMembers).toHaveLength(1);
    expect(aboutUs.teamMembers[0].name).toBe('Ram Singh');
    expect(aboutUs.teamMembers[0].position).toBe('Chef');
  });

  test('should create a new AboutUs document with highlights', () => {
    const aboutUs = new AboutUs(aboutUsData);

    expect(aboutUs.highlights).toContain('Authentic recipes');
    expect(aboutUs.highlights).toContain('Fresh ingredients');
    expect(aboutUs.highlights).toHaveLength(3);
  });

  test('should have createdAt timestamp', () => {
    const aboutUs = new AboutUs(aboutUsData);

    expect(aboutUs.createdAt).toBeDefined();
    expect(aboutUs.createdAt instanceof Date).toBe(true);
  });

  test('should have updatedAt timestamp', () => {
    const aboutUs = new AboutUs(aboutUsData);

    expect(aboutUs.updatedAt).toBeDefined();
    expect(aboutUs.updatedAt instanceof Date).toBe(true);
  });

  test('should accept minimal AboutUs data', () => {
    const minimalData = {
      title: 'Jhasha',
      description: 'Restaurant'
    };

    const aboutUs = new AboutUs(minimalData);

    expect(aboutUs.title).toBe('Jhasha');
    expect(aboutUs.description).toBe('Restaurant');
  });

  test('should accept multiple team members', () => {
    aboutUsData.teamMembers = [
      { name: 'Ram Singh', position: 'Chef' },
      { name: 'Sita Sharma', position: 'Manager' },
      { name: 'Hari Bista', position: 'Server' }
    ];

    const aboutUs = new AboutUs(aboutUsData);

    expect(aboutUs.teamMembers).toHaveLength(3);
  });

  test('should accept various social media platforms', () => {
    aboutUsData.socialMedia = {
      facebook: 'https://facebook.com/jhasha',
      instagram: 'https://instagram.com/jhasha',
      twitter: 'https://twitter.com/jhasha',
      youtube: 'https://youtube.com/jhasha'
    };

    const aboutUs = new AboutUs(aboutUsData);

    expect(Object.keys(aboutUs.socialMedia).length).toBeGreaterThan(0);
  });

  test('should handle image URLs', () => {
    aboutUsData.image = 'https://example.com/restaurant.jpg';

    const aboutUs = new AboutUs(aboutUsData);

    expect(aboutUs.image).toContain('https://');
  });

  test('should maintain data integrity', () => {
    const aboutUs = new AboutUs(aboutUsData);
    const original = JSON.stringify(aboutUsData);
    const current = JSON.stringify({
      title: aboutUs.title,
      description: aboutUs.description,
      image: aboutUs.image
    });

    expect(JSON.parse(original).title).toBe(JSON.parse(current).title);
  });

  test('should allow editing title', () => {
    const aboutUs = new AboutUs(aboutUsData);
    aboutUs.title = 'Updated Title';

    expect(aboutUs.title).toBe('Updated Title');
  });

  test('should allow editing description', () => {
    const aboutUs = new AboutUs(aboutUsData);
    aboutUs.description = 'Updated description';

    expect(aboutUs.description).toBe('Updated description');
  });

  test('should allow updating contact info', () => {
    const aboutUs = new AboutUs(aboutUsData);
    aboutUs.contact.email = 'newemail@jhasha.com';

    expect(aboutUs.contact.email).toBe('newemail@jhasha.com');
  });

  test('should allow updating social media links', () => {
    const aboutUs = new AboutUs(aboutUsData);
    aboutUs.socialMedia.facebook = 'https://facebook.com/newjhasha';

    expect(aboutUs.socialMedia.facebook).toBe('https://facebook.com/newjhasha');
  });

  test('should support adding new team members', () => {
    const aboutUs = new AboutUs(aboutUsData);
    const newMember = { name: 'New Chef', position: 'Sous Chef' };
    aboutUs.teamMembers.push(newMember);

    expect(aboutUs.teamMembers).toHaveLength(2);
    expect(aboutUs.teamMembers[1].name).toBe('New Chef');
  });

  test('should support removing team members', () => {
    aboutUsData.teamMembers = [
      { name: 'Ram Singh', position: 'Chef' },
      { name: 'Sita Sharma', position: 'Manager' }
    ];

    const aboutUs = new AboutUs(aboutUsData);
    aboutUs.teamMembers.pop();

    expect(aboutUs.teamMembers).toHaveLength(1);
  });

  test('should maintain highlights array', () => {
    const aboutUs = new AboutUs(aboutUsData);
    const initialLength = aboutUs.highlights.length;

    aboutUs.highlights.push('Award winning');

    expect(aboutUs.highlights.length).toBe(initialLength + 1);
  });

  test('should have proper vision statement', () => {
    const aboutUs = new AboutUs(aboutUsData);

    expect(aboutUs.vision).toMatch(/leading/i);
  });

  test('should have proper mission statement', () => {
    const aboutUs = new AboutUs(aboutUsData);

    expect(aboutUs.mission).toMatch(/authentic/i);
  });

  test('should handle empty team members array', () => {
    aboutUsData.teamMembers = [];

    const aboutUs = new AboutUs(aboutUsData);

    expect(aboutUs.teamMembers).toHaveLength(0);
  });

  test('should handle empty highlights array', () => {
    aboutUsData.highlights = [];

    const aboutUs = new AboutUs(aboutUsData);

    expect(aboutUs.highlights).toHaveLength(0);
  });

  test('should preserve all fields after creation', () => {
    const aboutUs = new AboutUs(aboutUsData);

    expect(aboutUs.title).toBeDefined();
    expect(aboutUs.description).toBeDefined();
    expect(aboutUs.image).toBeDefined();
    expect(aboutUs.vision).toBeDefined();
    expect(aboutUs.mission).toBeDefined();
    expect(aboutUs.contact).toBeDefined();
    expect(aboutUs.socialMedia).toBeDefined();
    expect(aboutUs.teamMembers).toBeDefined();
    expect(aboutUs.highlights).toBeDefined();
  });
});
