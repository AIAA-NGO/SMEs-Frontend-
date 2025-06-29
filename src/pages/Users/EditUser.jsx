import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  AlertTitle,
  CircularProgress,
  Paper,
  Checkbox,
  FormControl,
  Grid,
  Container,
  IconButton,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormControlLabel,
  Avatar,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  ManageAccounts as ManagerIcon,
  PointOfSale as CashierIcon
} from '@mui/icons-material';
import { getAuthData, hasRole } from '../../components/utils/auth';

const roleIcons = {
  ADMIN: <AdminIcon fontSize="small" />,
  MANAGER: <ManagerIcon fontSize="small" />,
  CASHIER: <CashierIcon fontSize="small" />
};

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId: currentUserId } = getAuthData();

  const [availableRoles, setAvailableRoles] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    roles: [],
    active: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordChange, setPasswordChange] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const api = useMemo(() => axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  }), []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError('');

        const [userResponse, rolesResponse] = await Promise.all([
          api.get(`/users/${id}`),
          api.get('/users/roles')
        ]);

        const user = userResponse.data;
        setFormData({
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          roles: user.roles || [],
          active: user.active
        });

        setAvailableRoles(rolesResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        if (error.response) {
          if (error.response.status === 401) {
            setError('Session expired. Please login again.');
          } else if (error.response.status === 403) {
            setError('You are not authorized to view this user');
          } else if (error.response.status === 404) {
            setError('User not found');
          } else {
            setError(error.response.data?.message || 'Failed to load user data');
          }
        } else {
          setError(error.message || 'Failed to load user data');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, api]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRoleChange = (event) => {
    const { value } = event.target;
    setFormData(prev => ({
      ...prev,
      roles: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordChange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const updateData = {
        username: formData.username,
        email: formData.email,
        fullName: formData.fullName,
        roles: formData.roles,
        active: formData.active
      };

      if (passwordChange.newPassword && passwordChange.newPassword === passwordChange.confirmPassword) {
        updateData.oldPassword = passwordChange.oldPassword;
        updateData.newPassword = passwordChange.newPassword;
      } else if (passwordChange.newPassword) {
        throw new Error("New passwords don't match");
      }

      await api.put(`/users/${id}`, updateData);
      navigate('/users', { state: { userUpdated: true } });
    } catch (error) {
      console.error('Error updating user:', error);
      if (error.response) {
        if (error.response.status === 400) {
          setError(error.response.data?.message || 'Validation error');
        } else if (error.response.status === 403) {
          setError('You are not authorized to perform this action');
        } else if (error.response.status === 401) {
          setError('Session expired. Please login again.');
        } else {
          setError(error.response.data?.message || 'Failed to update user');
        }
      } else {
        setError(error.message || 'Failed to update user');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCurrentUser = id === currentUserId;
  const canEditRoles = hasRole('ADMIN');
  const canEditStatus = hasRole('ADMIN') || hasRole('MANAGER');

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
        <Button
          variant="contained"
          startIcon={<BackIcon />}
          onClick={() => navigate('/users')}
        >
          Back to Users
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton onClick={() => navigate('/users')} sx={{ mr: 2 }}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Edit User
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar sx={{ width: 64, height: 64, mr: 3, bgcolor: 'primary.main' }}>
            <PersonIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h6">{formData.fullName || 'No name provided'}</Typography>
            <Typography variant="body2" color="text.secondary">
              {formData.username}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              {formData.roles?.map(role => (
                <Chip
                  key={role}
                  label={role}
                  size="small"
                  icon={roleIcons[role] || <PersonIcon fontSize="small" />}
                  color={
                    role === 'ADMIN' ? 'primary' : 
                    role === 'MANAGER' ? 'secondary' : 'default'
                  }
                />
              ))}
            </Box>
          </Box>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                variant="outlined"
                margin="normal"
                disabled={!canEditRoles && !isCurrentUser}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                variant="outlined"
                margin="normal"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                variant="outlined"
                margin="normal"
              />
            </Grid>

            {canEditRoles && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="roles-label">Roles</InputLabel>
                  <Select
                    labelId="roles-label"
                    id="roles"
                    name="roles"
                    multiple
                    value={formData.roles}
                    onChange={handleRoleChange}
                    label="Roles"
                    required
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip 
                            key={value} 
                            label={value} 
                            size="small"
                            icon={roleIcons[value]}
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {availableRoles.map((role) => (
                      <MenuItem key={role} value={role}>
                        <ListItemIcon>
                          {roleIcons[role] || <PersonIcon fontSize="small" />}
                        </ListItemIcon>
                        <ListItemText primary={role} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} md={canEditRoles ? 6 : 12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.active}
                    onChange={handleChange}
                    name="active"
                    color="primary"
                    disabled={!canEditStatus}
                  />
                }
                label="Active"
              />
            </Grid>

            {isCurrentUser && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Change Password
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    name="oldPassword"
                    type="password"
                    value={passwordChange.oldPassword}
                    onChange={handlePasswordChange}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={passwordChange.newPassword}
                    onChange={handlePasswordChange}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    value={passwordChange.confirmPassword}
                    onChange={handlePasswordChange}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => navigate('/users')}
                  sx={{ minWidth: 120 }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={isSubmitting}
                  sx={{ minWidth: 120 }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}