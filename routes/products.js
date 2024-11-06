const { Category } = require('../models/category');
const { Product } = require('../models/products');
const express = require('express');
const router = express.Router();
const pLimit = require('p-limit');
const cloudinary = require('cloudinary').v2;


router.get(`/`, async (req, res) => {
    const productList = await Product.find().populate("category");

    if (!productList) {
        res.status(500).json({ success: false })
    }
    res.send(productList);
});



router.post(`/create`, async (req, res) => {

    const category = await Category.findById(req.body.category);
    if (!category) {
        return res.status(404).send("Danh mục không hợp lệ!");
    }
    const limit = pLimit(2);

    const imagesToUpLoad = req.body.images.map((image) => {
        return limit(async () => {
            const result = await cloudinary.uploader.upload(image);
            return result;
        })
    });



    const uploadStatus = await Promise.all(imagesToUpLoad);

    const imgurl = uploadStatus.map((item) => {
        return item.secure_url
    })



    if (!uploadStatus) {
        return res.status(500).json({
            error: "Không thể tải lên hình ảnh!",
            status: false
        })
    }

    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        images: imgurl,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
    });

    product = await product.save();
    if (!product) {
        res.status(500).json({
            error: err,
            success: false
        })
    }

    res.status(201).json(product);
});


router.get('/:id', async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        res.status(500).json({
            message: 'Sản phẩm với ID đã cho không được tìm thấy.'
        })
    }
    return res.status(200).send(product);
})




router.delete('/:id', async (req, res) => {
    const deletProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletProduct) {
        return res.status(404).json({
            message: "Không tìm thấy sản phẩm!",
            status: false
        })
    }
    res.status(200).send({
        message: "Đã xóa sản phẩm!",
        status: true
    })
});



router.put('/:id', async (req, res) => {

    const limit = pLimit(2);

    const imagesToUpLoad = req.body.images.map((image) => {
        return limit(async () => {
            const result = await cloudinary.uploader.upload(image);
            return result;
        })
    });



    const uploadStatus = await Promise.all(imagesToUpLoad);

    const imgurl = uploadStatus.map((item) => {
        return item.secure_url
    })



    if (!uploadStatus) {
        return res.status(500).json({
            error: "Không thể tải lên hình ảnh!",
            status: false
        })
    }

    const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            images: imgurl,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,
        },
        { new: true }
    );

    if (!product) {
        res.status(404).json({
            message: 'Không thể cập nhật sản phẩm!',
            success: false
        })
    }
    res.status(200).json({
        message: 'Sản phẩm đã được cập nhật!',
        success: true
    });
})



module.exports = router;