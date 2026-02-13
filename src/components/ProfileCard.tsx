'use client';

import { Profile } from '@/types/profile';
import { useState, useEffect, useRef } from 'react';

interface ProfileCardProps {
  profile: Profile;
}

function getEmbedUrl(url: string): { type: 'video' | 'iframe', url: string } {
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/);
  if (youtubeMatch) {
    return { type: 'iframe', url: `https://www.youtube.com/embed/${youtubeMatch[1]}` };
  }
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return { type: 'iframe', url: `https://drive.google.com/file/d/${driveMatch[1]}/preview` };
  }
  if (url.includes('drive.google.com') && url.includes('/preview')) {
    return { type: 'iframe', url };
  }
  return { type: 'video', url };
}

function getDirectImageUrl(url: string): string {
  if (!url) return url;
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1000`;
  }
  return url;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    visitorName: '',
    visitorEmail: '',
    visitorPhone: '',
    message: ''
  });

  const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxFnumFLV0Uon-pbj4A4HJaQrqdBmpq2S0M_84LCYVmUcFkBNqKk6g1OWooOlua-xEX9g/exec';

  useEffect(() => {
    if (showContactModal && modalRef.current) {
      modalRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showContactModal]);

  const availabilityColors: Record<string, string> = {
    'In Office': 'bg-blue-100 text-blue-800 border-blue-300',
    'Remote': 'bg-green-100 text-green-800 border-green-300',
    'Available': 'bg-green-100 text-green-800 border-green-300',
    'Busy': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'On Leave': 'bg-red-100 text-red-800 border-red-300'
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formDataToSend = new URLSearchParams();
    formDataToSend.append('profileName', profile.name);
    formDataToSend.append('profileEmail', profile.email || '');
    formDataToSend.append('visitorName', formData.visitorName);
    formDataToSend.append('visitorEmail', formData.visitorEmail);
    formDataToSend.append('visitorPhone', formData.visitorPhone);
    formDataToSend.append('requirements', formData.message);

    fetch(GOOGLE_SHEET_URL + '?' + formDataToSend.toString(), {
      method: 'GET',
      redirect: 'follow'
    }).catch(error => console.error('Error submitting form:', error));

    setFormData({ visitorName: '', visitorEmail: '', visitorPhone: '', message: '' });
    
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowContactModal(false);
      }, 5000);
    }, 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Media Section */}
      <div className="relative w-full h-64 bg-gray-200">
        {profile.mediaType === 'video' ? (
          (() => {
            const embedData = getEmbedUrl(profile.mediaUrl);
            return embedData.type === 'iframe' ? (
              <iframe
                src={embedData.url}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <video
                src={embedData.url}
                controls
                controlsList="nodownload"
                className="w-full h-full object-contain bg-black"
                preload="metadata"
                poster={getDirectImageUrl(profile.thumbnailUrl || '')}
              >
                Your browser does not support the video tag.
              </video>
            );
          })()
        ) : (
          <img
            src={profile.mediaUrl}
            alt={profile.name}
            className="w-full h-full object-cover"
          />
        )}
        
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${availabilityColors[profile.availability] || 'bg-gray-100 text-gray-800'}`}>
            {profile.availability}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{profile.name}</h3>
        <p className="text-lg text-indigo-600 font-semibold mb-2">{profile.role}</p>
        
        <div className="flex items-center text-gray-600 mb-4">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-sm">{profile.experience} experience</span>
        </div>

        {profile.location && (
          <div className="flex items-center text-gray-600 mb-4">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm">{profile.location}</span>
          </div>
        )}

        {profile.bio && (
          <p className="text-gray-700 mb-4 text-sm">{profile.bio}</p>
        )}

        {/* Skills */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Skills</h4>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill, index) => (
              <span key={index} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          {profile.email && (
            <button
              onClick={() => setShowContactModal(true)}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
            >
              Hire
            </button>
          )}
          {profile.cvUrl && (
            <a
              href={profile.cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium text-center flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View CV
            </a>
          )}
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4" onClick={() => setShowContactModal(false)}>
          <div ref={modalRef} className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {showSuccess && (
              <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold">Request Submitted Successfully!</p>
                    <p className="text-sm mt-1">We&apos;ll get back to you soon. Or{' '}
                      <a href="https://cal.com/gsachdeva/30min" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-blue-900">
                        book a call now
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Hire {profile.name}</h3>
              <button onClick={() => setShowContactModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                <input type="text" required value={formData.visitorName}
                  onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Email *</label>
                <input type="email" required value={formData.visitorEmail}
                  onChange={(e) => setFormData({ ...formData, visitorEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Phone *</label>
                <input type="tel" required value={formData.visitorPhone}
                  onChange={(e) => setFormData({ ...formData, visitorPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="+1 (234) 567-8900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requirements *</label>
                <textarea required value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="Please describe your requirements..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowContactModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm">
                  {isSubmitting ? 'Submitting...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
