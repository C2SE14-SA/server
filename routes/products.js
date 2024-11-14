const { Category } = require('../models/category');
const { Product } = require('../models/products');
const express = require('express');
const router = express.Router();
// const pLimit = require('p-limit');
// const cloudinary = require('cloudinary').v2;

const multer = require('multer');

const fs = require("fs");

var imagesArr = [];
var productEditId;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads");
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`);
    },
})

const upload = multer({ storage: storage })

// router.post(`/upload`, upload.array("images"), async (req, res) => {
//     let images;
//     if (productEditId !== undefined) {
//         const product = await Product.findById(productEditId);

//         if (product) {
//             images = product.images;
//         }

//         if (images.length !== 0) {
//             for (image of images) {
//                 fs.unlinkSync(`uploads/${image}`);
//             }
//         }
//     }

//     imagesArr = [];
//     const files = req.files;

//     for (let i = 0; i <files.length; i++) {
//         imagesArr.push(files[i].filename);
//     }
//     res.send(imagesArr)
// });

router.post(`/upload`, upload.array("images"), async (req, res) => {
    
    if(productEditId!== undefined) {
        const product = await Product.findById(productEditId);

        const images = product.images;

        if(images.length !== 0) {
            for (image of images) {
                fs.unlinkSync(`uploads/${image}`);
            }
        }
    }

    imagesArr = [];
    const files = req.files;
    for (let i=0; i<files.length; i++) {
        imagesArr.push(files[i].filename);
    }

    res.send(imagesArr);
});

router.get(`/`, async (req, res) => {

    const page = parseInt(req.query.page) || 1;
    const perPage = 10;
    const totalPosts = await Product.countDocuments();
    const totalPages = Math.ceil(totalPosts / perPage);

    if (page > totalPages) {
        return res.status(404).json({ message: "Page not found" })
    }
    const productList = await Product.find().populate("category")
        .skip((page - 1) * perPage)
        .limit(perPage)
        .exec();


    if (!productList) {
        res.status(500).json({ success: false })
    }

    return res.status(200).json({
        "productList": productList,
        "totalPages": totalPages,
        "page": page
    });
    res.send(productList);
});



router.post(`/create`, async (req, res) => {

    const category = await Category.findById(req.body.category);
    if (!category) {
        return res.status(404).send("Danh mục không hợp lệ!");
    }

    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        images: imagesArr,
        brand: req.body.brand,
        price: req.body.price,
        oldPrice: req.body.oldPrice,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        // numReviews: req.body.numReviews,
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
    productEditId = req.params.id;
    const product = await Product.findById(req.params.id);
    if (!product) {
        res.status(500).json({
            message: 'Sản phẩm với ID đã cho không được tìm thấy.'
        })
    }
    return res.status(200).send(product);
})




router.delete('/:id', async (req, res) => {

    const product = await Product.findById(req.params.id);
    const images = product.images;

    if (images.length !== 0) {
        for (image of images) {
            fs.unlinkSync(`uploads/${image}`)
        }
    }


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

    const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            images: imagesArr,
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