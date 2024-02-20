package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"regexp"

	"github.com/celestiaorg/celestia-app/app"
	"github.com/celestiaorg/celestia-app/app/encoding"
	"github.com/celestiaorg/celestia-app/pkg/appconsts"
	"github.com/celestiaorg/celestia-app/pkg/namespace"
	"github.com/celestiaorg/celestia-app/pkg/user"
	blobtypes "github.com/celestiaorg/celestia-app/x/blob/types"
	"github.com/cosmos/cosmos-sdk/crypto/keyring"
	"github.com/spf13/cobra"
	tmproto "github.com/tendermint/tendermint/proto/tendermint/types"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// NAMESPACE is the namespace of the application
// Must be <= 10 bytes
const NAMESPACE = "cel-paint"

// MODE is the mode of the application (dev, test, or prod)
// This is used when indexing the data
const MODE = "dev"

func main() {
	var x, y int
	var color, grpcAddr, accountName string

	rootCmd := &cobra.Command{
		Use:   "celestia-paint [flags]",
		Short: "Celestia Paint CLI",
		Long:  `Celestia Paint CLI is a command line tool that allows users to submit 2D coordinates and a color for a PFB transaction.`,
	}

	rootCmd.PersistentFlags().IntVarP(&x, "x", "x", 0, "X coordinate (required)")
	rootCmd.PersistentFlags().IntVarP(&y, "y", "y", 0, "Y coordinate (required)")
	rootCmd.PersistentFlags().StringVarP(&color, "color", "c", "", "Color in hex format (required)")
	rootCmd.PersistentFlags().StringVar(&grpcAddr, "grpc.address", "localhost:9090", "gRPC address of the Celestia app node")
	rootCmd.PersistentFlags().StringVar(&accountName, "account.name", "celestia-paint", "Name of the account in the keyring")

	rootCmd.MarkPersistentFlagRequired("x")
	rootCmd.MarkPersistentFlagRequired("y")
	rootCmd.MarkPersistentFlagRequired("color")

	rootCmd.RunE = func(cmd *cobra.Command, args []string) error {
		// Validate color is in valid hex format
		matched, err := regexp.MatchString("^#[0-9A-Fa-f]{6}$", color)
		if err != nil {
			return err
		}
		if !matched {
			return fmt.Errorf("color must be in valid hex format (e.g., #FFFFFF)")
		}

		// Load the keyring
		cdc := encoding.MakeConfig(app.ModuleEncodingRegisters...).Codec
		fmt.Println(os.Getenv("HOME") + "/.celestia-app")
		kr, err := keyring.New("celestia-paint", keyring.BackendTest, os.Getenv("HOME")+"/.celestia-app", os.Stdin, cdc)
		if err != nil {
			return err
		}

		// Convert x, y, color, and mode into a JSON blob
		data, err := json.Marshal(map[string]interface{}{
			"mode":  MODE,
			"x":     x,
			"y":     y,
			"color": color,
		})
		if err != nil {
			return err
		}

		// Submit the data
		return SubmitData(grpcAddr, kr, accountName, data)
	}

	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

func SubmitData(grpcAddr string, kr keyring.Keyring, accountName string, data []byte) error {
	// Create an encoding config that can decode and encode all celestia-app data structures.
	ecfg := encoding.MakeConfig(app.ModuleEncodingRegisters...)

	// Create a connection to the gRPC server on the consensus node.
	conn, err := grpc.Dial(grpcAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return err
	}
	defer conn.Close()

	// Get the address of the account we want to use to sign transactions.
	rec, err := kr.Key(accountName)
	if err != nil {
		return err
	}

	addr, err := rec.GetAddress()
	if err != nil {
		return err
	}

	// Setup the signer. This function will automatically query the relevant
	// account information such as sequence (nonce) and account number.
	signer, err := user.SetupSigner(context.TODO(), kr, conn, addr, ecfg)
	if err != nil {
		return err
	}

	// Create a namespace for the transaction. This is typically specific to the application.
	ns := namespace.MustNewV0([]byte(NAMESPACE))

	// Create a blob with the provided data, including the mode.
	blob, err := blobtypes.NewBlob(ns, data, appconsts.ShareVersionZero)
	if err != nil {
		return err
	}

	// Estimate gas limit for the transaction.
	gasLimit := blobtypes.DefaultEstimateGas([]uint32{uint32(len(blob.Data))})

	// Set transaction options, including the gas limit and fee.
	options := []user.TxOption{
		user.SetGasLimitAndFee(gasLimit, 0.1), // Adjust the gas price as necessary.
	}

	// Submit the transaction and wait for it to be committed.
	resp, err := signer.SubmitPayForBlob(context.TODO(), []*tmproto.Blob{blob}, options...)
	if err != nil {
		return err
	}

	// Check the response code to see if the transaction was successful.
	if resp.Code != 0 {
		fmt.Println("Transaction failed:", resp.Code, resp.Codespace, resp.RawLog)
		return fmt.Errorf("transaction failed: %s", resp.RawLog)
	}

	fmt.Printf("Transaction submitted successfully. TxHash: %s\n", resp.TxHash)
	return nil
}
