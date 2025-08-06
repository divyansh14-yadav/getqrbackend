// controllers/themeController.js
import Theme from "../models/themeModel.js";

// GET theme for current user
export const getTheme = async (req, res) => {
  try {
    const theme = await Theme.findOne({ userId: req.user._id });
    if (!theme) {
      return res.status(404).json({ message: "Theme not found" });
    }
    res.json(theme);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch theme" });
  }
};

// SAVE or UPDATE theme
export const saveTheme = async (req, res) => {
  try {
    const { primaryColor, backgroundStyle, fontStyle } = req.body;

    let theme = await Theme.findOne({ userId: req.user._id });

    if (theme) {
      theme.primaryColor = primaryColor;
      theme.backgroundStyle = backgroundStyle;
      theme.fontStyle = fontStyle;
    } else {
      theme = new Theme({
        userId: req.user._id,
        primaryColor,
        backgroundStyle,
        fontStyle,
      });
    }

    await theme.save();
    res.json(theme);
  } catch (error) {
    res.status(500).json({ message: "Failed to save theme" });
  }
};

