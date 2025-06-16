import { useState, useEffect } from "react";
import axios from "axios";

const AccountPage = () => {
  const [user, setUser] = useState({});
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({});
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [additionalDetails, setAdditionalDetails] = useState({
    bio: '',
    phone: '',
    address: '',
    website: '',
    socialMedia: {
      twitter: '',
      linkedin: '',
      github: ''
    }
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/users/me");
        setUser(res.data);
        setForm(res.data);
        setPreviewImage(res.data.profileImage);
        if (res.data.additionalDetails) {
          setAdditionalDetails(res.data.additionalDetails);
        }
      } catch (err) {
        setError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedData = { 
        ...form,
        additionalDetails
      };

      if (profileImage) {
        const formData = new FormData();
        formData.append("file", profileImage);

        const uploadRes = await axios.post(`/api/users/${user.id}/upload-profile`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        updatedData.profileImage = uploadRes.data.url;
      }

      await axios.put(`/api/users/${user.id}`, updatedData);
      setUser(updatedData);
      setPreviewImage(updatedData.profileImage);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
      setEdit(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      return setError("New passwords do not match");
    }

    try {
      setLoading(true);
      setError(null);
      
      await axios.put(`/api/users/${user.id}/change-password`, {
        currentPassword: passwordData.current,
        newPassword: passwordData.new,
      });
      
      setSuccess("Password changed successfully!");
      setTimeout(() => setSuccess(null), 3000);
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (err) {
      setError(err.response?.data?.message || "Password change failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialMediaChange = (platform, value) => {
    setAdditionalDetails({
      ...additionalDetails,
      socialMedia: {
        ...additionalDetails.socialMedia,
        [platform]: value
      }
    });
  };

  if (loading && !user.id) {
    return <div className="max-w-2xl mx-auto p-6 mt-10 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 mt-4 md:mt-10 bg-white rounded-lg shadow-md">
      {/* Notification Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Account Settings</h1>
      
      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 font-medium ${activeTab === 'profile' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`px-4 py-2 font-medium ${activeTab === 'password' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
        >
          Password
        </button>
        <button
          onClick={() => setActiveTab('social')}
          className={`px-4 py-2 font-medium ${activeTab === 'social' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
        >
          Social Media
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-shrink-0">
              <img
                src={previewImage || "/default-profile.png"}
                alt="Profile"
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-2 border-gray-200"
              />
              {edit && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Change Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setProfileImage(file);
                        setPreviewImage(URL.createObjectURL(file));
                      }
                    }}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                </div>
              )}
            </div>

            <div className="flex-grow space-y-4 w-full">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  disabled={!edit}
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="border border-gray-300 rounded-md p-2 w-full focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  disabled
                  value={form.email || ''}
                  className="border border-gray-300 rounded-md p-2 w-full bg-gray-100"
                />
              </div>
            </div>
          </div>

          {edit && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={additionalDetails.bio || ''}
                  onChange={(e) => setAdditionalDetails({...additionalDetails, bio: e.target.value})}
                  rows="3"
                  className="border border-gray-300 rounded-md p-2 w-full focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    value={additionalDetails.phone || ''}
                    onChange={(e) => setAdditionalDetails({...additionalDetails, phone: e.target.value})}
                    className="border border-gray-300 rounded-md p-2 w-full focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    value={additionalDetails.website || ''}
                    onChange={(e) => setAdditionalDetails({...additionalDetails, website: e.target.value})}
                    className="border border-gray-300 rounded-md p-2 w-full focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={additionalDetails.address || ''}
                  onChange={(e) => setAdditionalDetails({...additionalDetails, address: e.target.value})}
                  rows="2"
                  className="border border-gray-300 rounded-md p-2 w-full focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            {edit ? (
              <>
                <button
                  onClick={() => {
                    setEdit(false);
                    setForm(user);
                    setAdditionalDetails(user.additionalDetails || additionalDetails);
                    setPreviewImage(user.profileImage);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEdit(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              placeholder="Enter current password"
              value={passwordData.current}
              onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
              className="border border-gray-300 rounded-md p-2 w-full focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={passwordData.new}
              onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
              className="border border-gray-300 rounded-md p-2 w-full focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Minimum 8 characters with at least one number and one special character</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={passwordData.confirm}
              onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
              className="border border-gray-300 rounded-md p-2 w-full focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleChangePassword}
              disabled={loading || !passwordData.current || !passwordData.new || !passwordData.confirm}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      )}

      {/* Social Media Tab */}
      {activeTab === 'social' && (
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
            <div className="flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                twitter.com/
              </span>
              <input
                type="text"
                value={additionalDetails.socialMedia?.twitter || ''}
                onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                placeholder="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
            <div className="flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                linkedin.com/in/
              </span>
              <input
                type="text"
                value={additionalDetails.socialMedia?.linkedin || ''}
                onChange={(e) => handleSocialMediaChange('linkedin', e.target.value)}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                placeholder="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
            <div className="flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                github.com/
              </span>
              <input
                type="text"
                value={additionalDetails.socialMedia?.github || ''}
                onChange={(e) => handleSocialMediaChange('github', e.target.value)}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                placeholder="username"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Social Profiles'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPage;