"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { PRODUCT_GENDERS, type NewCatalogItem, type ProductGender } from "@/lib/local/catalog";

const MIN_DESCRIPTION_LENGTH = 10;

const emptyForm = {
  title: "",
  price: "",
  fabric: "",
  category: "",
  gender: "Women" as ProductGender,
  description: "",
};

type FormErrors = Partial<Record<keyof typeof emptyForm, string>>;

function validate(form: typeof emptyForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.title.trim()) errors.title = "Give the piece a name.";

  const price = Number(form.price);
  if (!form.price.trim()) errors.price = "Enter a price.";
  else if (!Number.isFinite(price) || price <= 0) errors.price = "Price must be above zero.";

  if (!form.fabric.trim()) errors.fabric = "Name the fabric.";
  if (!form.category.trim()) errors.category = "Choose a category.";
  if (form.description.trim().length < MIN_DESCRIPTION_LENGTH) {
    errors.description = `At least ${MIN_DESCRIPTION_LENGTH} characters.`;
  }
  return errors;
}

/**
 * One product form for both paths — a Vendor submitting for review and an
 * Admin publishing directly. Only the copy on the submit button differs.
 */
export function ProductForm({
  submitLabel,
  onSubmit,
  onCancel,
}: {
  submitLabel: string;
  onSubmit: (item: NewCatalogItem) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  function update<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onSubmit({
      title: form.title.trim(),
      price: Number(form.price),
      fabric: form.fabric.trim(),
      category: form.category.trim(),
      gender: form.gender,
      description: form.description.trim(),
      image,
    });

    setForm(emptyForm);
    setImage(null);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="border border-outline-variant p-8">
      <ImageUpload
        label="Product Image"
        value={image}
        onChange={setImage}
        shape="portrait"
        alt=""
        hint="Optional. PNG, JPEG, or WebP — resized automatically."
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <TextField
          label="Product Name"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          error={errors.title}
          placeholder="Emerald Silk Unstitched Set"
        />
        <TextField
          label="Price (PKR)"
          inputMode="numeric"
          value={form.price}
          onChange={(e) => update("price", e.target.value)}
          error={errors.price}
          placeholder="24500"
        />
        <TextField
          label="Fabric"
          value={form.fabric}
          onChange={(e) => update("fabric", e.target.value)}
          error={errors.fabric}
          placeholder="Silk"
        />
        <TextField
          label="Category"
          value={form.category}
          onChange={(e) => update("category", e.target.value)}
          error={errors.category}
          placeholder="3-Piece Suits"
        />
        <SelectField
          label="Gender"
          value={form.gender}
          onChange={(e) => update("gender", e.target.value as ProductGender)}
        >
          {PRODUCT_GENDERS.map((gender) => (
            <option key={gender} value={gender}>
              {gender}
            </option>
          ))}
        </SelectField>
        <div className="sm:col-span-2">
          <TextAreaField
            label="Description"
            rows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            error={errors.description}
            hint="Fabric weight, finish, and what makes the piece distinct."
          />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <Button type="submit" variant="primary">
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
