// Add this at the top of the file for TypeScript global declaration
// @ts-ignore
// eslint-disable-next-line
declare global {
  interface Window {
    gapi: any;
    google: any;
    cloudinary: any;
  }
}

import React, { useState, useRef } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../lib/auth';

const GOOGLE_CLIENT_ID = '446600028660-27po8kcln0j3idnkvn2mj62p4ml8rqh0.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive';

const wasteCategories = [
  'glass',
  'metal',
  'organic',
  'paper',
  'plastic',
];

// Load GIS script
const loadGisScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.accounts) return resolve(window.google);
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

const loadGapiScript = () => {
  return new Promise((resolve, reject) => {
    if (window.gapi) return resolve(window.gapi);
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client', () => resolve(window.gapi));
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

const Upload = () => {
  const { user } = useAuth();
  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useForm();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileTypeError, setFileTypeError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalInfo, setModalInfo] = useState<{confidence: number, predicted: string, data: any} | null>(null);
  const [forceUnverified, setForceUnverified] = useState(false);

  // Cloudinary widget open function
  const openCloudinaryWidget = (callback: (url: string) => void) => {
    if (!window.cloudinary) {
      const script = document.createElement('script');
      script.src = 'https://widget.cloudinary.com/v2.0/global/all.js';
      script.onload = () => openCloudinaryWidget(callback);
      document.body.appendChild(script);
      return;
    }
    window.cloudinary.openUploadWidget(
      {
        cloudName: 'df5hqpfbu', // <-- REPLACE with your Cloudinary cloud name
        uploadPreset: 'unsigned_preset', // <-- REPLACE with your unsigned upload preset
        sources: ['local', 'url', 'camera'],
        multiple: false,
        cropping: false,
        folder: 'waste_items',
      },
      (error: any, result: any) => {
        if (!error && result && result.event === 'success') {
          const url: string = result.info.secure_url;
          // Validate file extension
          if (!url.match(/\.(jpg|jpeg|png)$/i)) {
            setFileTypeError('Wrong image type. Only .jpg, .jpeg, .png files are accepted.');
            setImagePreview(null);
            return;
          } else {
            setFileTypeError(null);
          }
          callback(url);
          setImagePreview(url);
        }
      }
    );
  };

  const onSubmit = async (data: any) => {
    if (!user) {
      setError('You must be logged in to upload waste.');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      // 1. Verify category with backend using image URL
      const verifyRes = await fetch('http://127.0.0.1:8000/api/verify-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_category: data.category,
          image_url: data.image_url,
        }),
      });
      const verifyData = await verifyRes.json();

      let force_unverified = false;
      if (!verifyData.verified) {
        if (verifyData.confidence < 0.95) {
          setModalInfo({
            confidence: verifyData.confidence,
            predicted: verifyData.predicted_category,
            data
          });
          setShowModal(true);
          setUploading(false);
          return; // Wait for user to interact with modal
        } else {
          setError(`Model is confident this is: ${verifyData.predicted_category}. Please check your category.`);
          setUploading(false);
          return;
        }
      }

      // 2. Proceed with the original upload if verified or forced
      const response = await fetch('http://127.0.0.1:8000/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          username: user.username,
          description: data.description,
          image_url: data.image_url,
          category: data.category,
          amount_kg: parseFloat(data.amount_kg),
          force_unverified,
        }),
      });
      if (!response.ok) throw new Error('Failed to upload waste item');
      reset();
      setImagePreview(null);
      alert('Waste item uploaded successfully!');
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleModalConfirm = async () => {
    if (!modalInfo || !user) return;
    setShowModal(false);
    setUploading(true);
    setForceUnverified(true);
    const { data } = modalInfo;
    const response = await fetch('http://127.0.0.1:8000/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        username: user.username,
        description: data.description,
        image_url: data.image_url,
        category: data.category,
        amount_kg: Number(data.amount_kg),
        force_unverified: true,
      }),
    });
    if (!response.ok) {
      setError('Failed to upload waste item');
    } else {
      reset();
      setImagePreview(null);
      alert('Waste item uploaded successfully!');
    }
    setUploading(false);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Waste Items</h1>
          <p className="text-lg text-gray-600">Help others find value in what you no longer need</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-eco-primary">Upload Waste Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <Button
                  type="button"
                  onClick={() => openCloudinaryWidget((url) => setValue('image_url', url))}
                  disabled={uploading}
                  className="mb-2"
                >
                  Upload Image
                </Button>
                <p className="text-xs text-gray-400 mt-1">Only .jpg, .jpeg, and .png formats are accepted.</p>
                {fileTypeError && <p className="text-red-500 text-sm mt-1">{fileTypeError}</p>}
                {errors.image_url && <p className="text-red-500 text-sm mt-1">{errors.image_url.message as string}</p>}
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="mt-2 max-h-48 rounded" />
                )}
                <input type="hidden" {...register('image_url', { required: 'Image is required' })} />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your waste item..."
                  {...register('description', { required: 'Description is required' })}
                  disabled={uploading}
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message as string}</p>}
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Controller
                  name="category"
                  control={control}
                  rules={{ required: 'Category is required' }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={uploading}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {wasteCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message as string}</p>}
              </div>
              <div>
                <Label htmlFor="amount_kg">Amount (kg)</Label>
                <Input
                  id="amount_kg"
                  type="number"
                  min={0.1}
                  max={100}
                  step={0.1}
                  placeholder="Enter amount in kg (e.g. 1.2)"
                  {...register('amount_kg', { required: 'Amount is required', min: 0.1 })}
                  disabled={uploading}
                />
                {errors.amount_kg && <p className="text-red-500 text-sm mt-1">{errors.amount_kg.message as string}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</Button>
              {error && <p className="text-red-500 text-center mt-2">{error}</p>}
            </form>
          </CardContent>
        </Card>
      </div>
      {/* Modal for AI low confidence and user override */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
            <h2 className="text-lg font-bold mb-2">AI is not confident</h2>
            <p>
              AI confidence: <b>{(modalInfo?.confidence * 100).toFixed(1)}%</b><br />
              Model prediction: <b>{modalInfo?.predicted}</b>
            </p>
            <p className="mt-2">Do you want to proceed with your selected category anyway?</p>
            <div className="flex justify-center gap-4 mt-4">
              <button
                className="px-4 py-2 bg-eco-primary text-white rounded hover:bg-eco-primary-dark"
                onClick={handleModalConfirm}
              >
                Proceed
              </button>
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Upload;
