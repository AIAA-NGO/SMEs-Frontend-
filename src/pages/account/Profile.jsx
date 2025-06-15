import { useState, useEffect } from "react";
import axios from "axios";

const AccountPage = () => {
  const [user, setUser] = useState({});
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({});
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    axios.get("/api/users/me")
      .then((res) => {
        setUser(res.data);
        setForm(res.data);
        setPreviewImage(res.data.profileImage); // assuming backend returns profileImage URL
      });
  }, []);

  const handleSave = async () => {
    try {
      const updatedData = { ...form };

      if (profileImage) {
        const formData = new FormData();
        formData.append("file", profileImage);

        const uploadRes = await axios.post(`/api/users/${user.id}/upload-profile`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        updatedData.profileImage = uploadRes.data.url;
      }

      await axios.put(`/api/users/${user.id}`, updatedData);
      alert("Profile updated!");
      setEdit(false);
      setUser(updatedData);
      setPreviewImage(updatedData.profileImage);
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      return alert("New passwords do not match.");
    }

    try {
      await axios.put(`/api/users/${user.id}/change-password`, {
        currentPassword: passwordData.current,
        newPassword: passwordData.new,
      });
      alert("Password changed!");
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (err) {
      console.error(err);
      alert("Password change failed.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10 bg-white rounded shadow space-y-6">
      <h2 className="text-xl font-bold text-gray-700">My Account</h2>

      {/* Profile Image */}
      <div className="flex items-center space-x-4">
        <img
          src={previewImage || "/default-profile.png"}
          alt="Profile"
          className="w-20 h-20 rounded-full object-cover border"
        />
        {edit && (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              setProfileImage(file);
              setPreviewImage(URL.createObjectURL(file));
            }}
            className="mt-2"
          />
        )}
      </div>

      {/* Profile Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm">Name:</label>
          <input
            disabled={!edit}
            value={form.name || ''}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border p-2 w-full rounded"
          />
        </div>

        <div>
          <label className="block text-sm">Email:</label>
          <input
            disabled
            value={form.email || ''}
            className="border p-2 w-full bg-gray-100 rounded"
          />
        </div>

        <div>
          {edit ? (
            <button
              onClick={handleSave}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Save Changes
            </button>
          ) : (
            <button
              onClick={() => setEdit(true)}
              className="bg-gray-300 text-black px-4 py-2 rounded"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Password Change */}
      <div className="border-t pt-4">
        <h3 className="text-md font-semibold text-gray-700 mb-2">Change Password</h3>
        <input
          type="password"
          placeholder="Current Password"
          value={passwordData.current}
          onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
          className="border p-2 w-full mb-2 rounded"
        />
        <input
          type="password"
          placeholder="New Password"
          value={passwordData.new}
          onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
          className="border p-2 w-full mb-2 rounded"
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={passwordData.confirm}
          onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
          className="border p-2 w-full mb-2 rounded"
        />
        <button
          onClick={handleChangePassword}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Update Password
        </button>
      </div>
    </div>
  );
};

export default AccountPage;
